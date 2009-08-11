require 'thread'

class Wee
  class SearchPos
    attr_accessor :position, :detail, :passthrough
    def initialize(position, detail=:at, passthrough=nil)
      @position = position
      @detail = detail
      @passthrough = passthrough
    end
  end
  class HandlerWrapperBase; end

  def initialize
    # Waring: redefined, see wee_initialize
    # setting default values
    @__wee_search_positions = Hash.new
    @__wee_search = false
  end
  def self::wee_initialize
    define_method :initialize do
      @__wee_search_positions = Hash.new
      @__wee_search = false
      @__wee_stop_positions = Array.new
      @__wee_threads = Array.new;

      initialize_search if methods.include?('initialize_search')
      initialize_context if methods.include?('initialize_context')
      initialize_handler if methods.include?('initialize_handler')
      
      state = :ready
    end
  end

  def self::search(wee_search)
    define_method :initialize_search do 
      self.search=wee_search
    end
    wee_initialize
  end

  def self::endpoint(endpoints)
    endpoints.each do |name,value|
      define_method name do
        return value
      end
      define_method "#{name}=" do |new_value|
        instance_variable_set("@#{name}", new_value)
        instance_eval("def #{name}\n return @#{name}\n end")
      end
    end
  end

  def self::context(variables)
    @@__wee_new_context_variables ||= Array.new
    @@__wee_new_context_variables << variables
    define_method :initialize_context do
      @@__wee_new_context_variables.each { |item| self.context=item }
    end
    wee_initialize
  end

  def self::handler(aClassname)
    define_method :initialize_handler do self.handler=aClassname end
    wee_initialize
  end

  def self::control(flow, &block)
    @@__wee_control_blocks ||= Array.new
    @@__wee_control_blocks << block
    define_method :__wee_execute do
      state = :running
      @@__wee_control_blocks.each{ |a_block| instance_eval(&a_block)}
      state = :finished if state == :running
      [state, position, context]
    end
  end

  def self::flow; end

  protected
    def position
      @__wee_stop_positions
    end
    def activity(position, type, endpoint=nil, *parameters)
      return if state == :stopped || Thread.current[:nolongernecessary] || is_in_search_mode(position)
      
      handler = @__wee_handler.new
      begin
        case type
          when :manipulate
            yield if block_given?
            refreshcontext
            handler.inform_activity_done position, context
          when :call
            passthrough = get_matching_search_position(position) ? get_matching_search_position(position).passthrough : nil
            retValue = perform_external_call position, passthrough, handler, endpoint, parameters
            yield(retValue) if block_given? && state != :stopped && !Thread.current[:nolongernecessary]
            refreshcontext
            handler.inform_activity_done position, context unless state == :stopped || Thread.current[:nolongernecessary]
        else
          raise "Invalid activity type #{type}. Only :manipulate or :call allowed"
        end
      rescue => err
        refreshcontext
        handler.inform_activity_failed position, context, err
      end
    end
    # Parallel DSL-Construct
    # Defines Workflow paths that can be executed parallel.
    # May contain multiple branches (parallel_branch)
    def parallel(type=:wait)
      return if state == :stopped || Thread.current[:nolongernecessary]

      mythreads = Array.new
      # Handle the yield block (= def of parallel branches) in a 
      # Mutex to resolve conflicts (waiting for branches) in 
      # nested parallel blocks
      @__wee_mutex ||= Mutex.new
      @__wee_mutex.synchronize do
        @__wee_threads = Array.new
        yield
        mythreads = @__wee_threads.clone
      end
      wait_count = (type.is_a?(Hash) && type.size == 1 && type[:wait] != nil && type[:wait].is_a?(Integer)) ? wait_count = type[:wait] : mythreads.size
      finished_threads_count = 0
      while(finished_threads_count < wait_count && finished_threads_count < mythreads.size)
        Thread.pass
        finished_threads_count = 0
        mythreads.each { |thread| finished_threads_count+=1 unless thread.alive? }
      end
      mythreads.each { |thread| thread[:nolongernecessary] = true if thread.alive? }
    end
    # Defines a branch of a parallel-Construct
    def parallel_branch
      return if state == :stopped || Thread.current[:nolongernecessary]
      @__wee_threads << Thread.new do
        Thread.current[:branch_search] = @__wee_search
        yield
      end
    end

    # Choose DSL-Construct
    # Defines a choice in the Workflow path.
    # May contain multiple execution alternatives
    def choose
      return if state == :stopped || Thread.current[:nolongernecessary]
      thread_search = is_in_search_mode
      Thread.new do
        Thread.current[:branch_search] = thread_search
        Thread.current[:alternative_executed] = false
        yield
      end.join
    end
    # Defines a possible choice of a choose-Construct
    # Block is executed if condition == true or
    # searchmode is active (to find the starting position)
    def alternative(condition)
      return if state == :stopped || Thread.current[:nolongernecessary]
      yield if is_in_search_mode || condition
      Thread.current[:alternative_executed] = true if condition
    end
    def otherwise
      return if state == :stopped || Thread.current[:nolongernecessary]
      yield if is_in_search_mode || !Thread.current[:alternative_executed]
    end

    def critical(id)
      @__wee_critical ||= Mutex.new
      semaphore = nil
      @__wee_critical.synchronize do
        @__wee_critical_sections ||= {}
        semaphore = @__wee_critical_sections[id] ? @__wee_critical_sections[id] : Mutex.new
        @__wee_critical_sections[id] = semaphore if id
      end
      semaphore.synchronize do
        yield
      end
    end
    def cycle(condition)
      raise "condition must be a string to evaluate" unless condition.is_a?(String)
      return if state == :stopped || Thread.current[:nolongernecessary]
      yield if is_in_search_mode
      return if is_in_search_mode
      while eval(condition)
        yield
      end

    end

    
  private
    def is_in_search_mode(position = nil)
      # set semaphore to avoid conflicts if @__wee_search is changed by another thread
      Mutex.new.synchronize do
        branch = Thread.current
        if position && get_matching_search_position(position) # matching searchposition => start execution from here
          searchpos = get_matching_search_position(position)
          branch[:branch_search] = false
          @__wee_search = false
          return searchpos.detail == :after
        end
        return branch[:branch_search] || @__wee_search # is activity part of a branch and in search mode?
      end
    end
    def perform_external_call(position, passthrough, handler, endpoint, *parameters)
      # handshake call and wait until it finisheds
      handler.handle_call position, passthrough, endpoint, parameters
      Thread.pass until handler.finished_call() || state == :stopped || Thread.current[:nolongernecessary]
       
      handler.no_longer_necessary if Thread.current[:nolongernecessary]
      handler.stop_call if state == :stopped
      @__wee_stop_positions << Wee::SearchPos.new(position, :at, handler.passthrough) if state == :stopped
      Thread.current[:nolongernecessary] || state == :stopped ? nil : handler.return_value
    end
    def refreshcontext()
      @__wee_context.each do |varname, value|
        @__wee_context[varname] = instance_variable_get(varname)
      end
    end
    def get_matching_search_position(position)
      @__wee_search_positions[position]
    end
    def state=(newState)
      @__wee_stop_positions = Array.new if state != newState
      self.search = {@__wee_search_original => @__wee_search_positions_original}
      @__wee_state = newState
      handler = @__wee_handler.new
      handler.inform_workflow_state newState
    end

  public
    def handler=(new_wee_handler)
      superclass = new_wee_handler
      while(superclass)
        check_ok = true if(superclass == Wee::HandlerWrapperBase)
        superclass = superclass.superclass;
      end
      raise("Handler is not inhereted from HandlerWrapperBase") unless check_ok
      @__wee_handler = new_wee_handler
    end
    def state
      @__wee_state || :running
    end
    def endpoint(new_endpoint)
      new_endpoint.each do |name,value|
        instance_variable_set("@#{name}", value)
        instance_eval("def #{name}\n return @#{name}\n end")
      end
    end
    def search
      if(@__wee_search_original)
        {@__wee_search_original => @__wee_search_positions_original}
      else
        {false => []}
      end
    end
    def search=(new_wee_search)
      @__wee_search_positions = {}
      @__wee_search_positions_original = []
      if new_wee_search.is_a?(Hash) && new_wee_search.size == 1
          @__wee_search_original = new_wee_search.keys[0]
          @__wee_search_positions_original = new_wee_search[@__wee_search_original]
          @__wee_search_positions_original.each { |search_position| @__wee_search_positions[search_position.position] = search_position } if @__wee_search_positions_original.is_a?(Array)
          @__wee_search_positions[@__wee_search_positions_original.position] = @__wee_search_positions_original if @__wee_search_positions_original.is_a?(Wee::SearchPos)
      else
        @__wee_search_original = false
      end
      @__wee_search = @__wee_search_original
    end
    def context=(new_context)
      @__wee_context ||= Hash.new
      new_context.each do |name, value|
        instance_variable_set(("@" + name.to_s).to_sym,value)
        @__wee_context[("@" + name.to_s).to_sym] = value
      end
    end
    def context (opt_param = [])
      if(opt_param.is_a?(Hash))
        self.context=opt_param
      else
        opt_param.each{ |entry| self.context=entry }
      end
      return @__wee_context ? @__wee_context : Hash.new
    end

    def stop()
      state = :stopped
    end
    def start()
      return nil if state == :running
      __wee_execute
    end

    def replace(&blk)
      (class << self; self; end).class_eval do
        define_method :__wee_execute do
          self.state = :running
          instance_eval(&blk)
          [state, position, context]
        end
      end
    end
end
