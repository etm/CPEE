require 'thread'

class Wee
  class CHash < Hash
    def clear
      self.each do |k,v|
        self.remove_instance_variable(k)
      end
      superclass.clear    
    end
  end
  class SearchPos
    attr_accessor :position, :detail, :passthrough
    def initialize(position, detail=:at, passthrough=nil)
      @position = position
      @detail = detail
      @passthrough = passthrough
    end
  end
  class HandlerWrapperBase 
    # indicates if the return values should be expanded before given to the block
    def expand_params?
      @expand_params || false
    end
  end

  def initialize
    # Waring: redefined, see wee_initialize
    # setting default values
    @__wee_search_positions = @__wee_search_positions_original = {}
    @__wee_search = false
    @__wee_stop_positions = Array.new
    @__wee_threads = Array.new
    @__wee_context ||= CHash.new
    self.state = :ready
  end
  def self::wee_initialize
    define_method :initialize do
      @__wee_search_positions = @__wee_search_positions_original = {}
      @__wee_search = false
      @__wee_stop_positions = Array.new
      @__wee_threads = Array.new
      @__wee_context ||= CHash.new

      initialize_search if methods.include?('initialize_search')
      initialize_context if methods.include?('initialize_context')
      initialize_endpoints if methods.include?('initialize_endpoints')
      initialize_handler if methods.include?('initialize_handler')
      self.state = :ready
    end
  end

  def self::search(wee_search)
    define_method :initialize_search do 
      self.search wee_search
    end
    wee_initialize
  end

  def self::endpoint(endpoints)
    @@__wee_new_endpoints ||= {}
    @@__wee_new_endpoints.merge! endpoints
    define_method :initialize_endpoints do
      self.endpoint @@__wee_new_endpoints
    end
  end

  def self::context(variables)
    @@__wee_new_context_variables ||= []
    @@__wee_new_context_variables << variables
    define_method :initialize_context do
      @@__wee_new_context_variables.each { |item| self.context item }
    end
    wee_initialize
  end

  def self::handler(aClassname, *args)
    define_method :initialize_handler do self.handler=aClassname; self.handlerargs=args; end
    wee_initialize
  end

  def self::control(flow, &block)
    @@__wee_control_blocks ||= Array.new
    @@__wee_control_blocks << block
    define_method :__wee_execute do
      self.state = :running
      @@__wee_control_blocks.each{ |a_block| instance_eval(&a_block)}
      self.state = :finished if self.state == :running
      [self.state, position, context]
    end
  end

  def self::flow; end

  protected
    def position
      @__wee_stop_positions
    end

    # DSL-Construct for an atomic activity
    # position: a unique identifier within the wf-description (may be used by the search to identify a starting point
    # type:
    #   - :manipulate - just yield a given block
    #   - :call - order the handler to perform a service call
    # endpoint: (only with :call) ep of the service
    # parameters: (only with :call) service parameters
    def activity(position, type, endpoint=nil, *parameters)
      return if self.state == :stopped || Thread.current[:nolongernecessary] || is_in_search_mode(position)
      handler = @__wee_handler.new handlerargs
      begin
        case type
          when :manipulate
            if block_given?
              handler.inform_activity_manipulate position, context
              yield
            end  
            refreshcontext
            handler.inform_activity_done position, context
          when :call
            passthrough = get_matching_search_position(position) ? get_matching_search_position(position).passthrough : nil
            handler.inform_activity_next position, context
            ret_value = perform_external_call position, passthrough, handler, @__wee_endpoints[endpoint], *parameters
            if block_given? && self.state != :stopped && !Thread.current[:nolongernecessary]
              handler.inform_activity_manipulate position, context
              if ret_value.is_a?(Array) && handler.expand_params? 
                yield *ret_value
              else
                yield ret_value
              end
            end
            refreshcontext
            handler.inform_activity_done position, context
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
      return if self.state == :stopped || Thread.current[:nolongernecessary]

      mythreads = Array.new
      # Handle the yield block (= def of parallel branches) in a 
      # Mutex to resolve conflicts (waiting for branches)
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
      return if self.state == :stopped || Thread.current[:nolongernecessary]
      @__wee_threads << Thread.new do
        Thread.current[:branch_search] = @__wee_search
        yield
      end
    end

    # Choose DSL-Construct
    # Defines a choice in the Workflow path.
    # May contain multiple execution alternatives
    def choose
      return if self.state == :stopped || Thread.current[:nolongernecessary]
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
      return if self.state == :stopped || Thread.current[:nolongernecessary]
      yield if is_in_search_mode || condition
      Thread.current[:alternative_executed] = true if condition
    end
    def otherwise
      return if self.state == :stopped || Thread.current[:nolongernecessary]
      yield if is_in_search_mode || !Thread.current[:alternative_executed]
    end

    # Defines a critical block (=Mutex)
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

    # Defines a Cycle (loop/iteration)
    def cycle(condition)
      raise "condition must be a string to evaluate" unless condition.is_a?(String)
      return if self.state == :stopped || Thread.current[:nolongernecessary]
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
      params = { }
      parameters.each do |p|
        if p.class == Hash && parameters.length == 1
          params = p
        else  
          if !p.is_a?(Symbol) || !@__wee_context.include?(p)
            raise("not all passed parameters are context variables")
          end
          params[p] = @__wee_context[p]
        end
      end
      # handshake call and wait until it finisheds
      handler.handle_call position, passthrough, endpoint, params
      Thread.pass until handler.finished_call() || self.state == :stopped || Thread.current[:nolongernecessary]
       
      handler.no_longer_necessary if Thread.current[:nolongernecessary]
      handler.stop_call if self.state == :stopped
      @__wee_stop_positions << Wee::SearchPos.new(position, :at, handler.passthrough) if self.state == :stopped
      Thread.current[:nolongernecessary] || self.state == :stopped ? nil : handler.return_value
    end
    def refreshcontext()
      @__wee_context.each do |varname, value|
        @__wee_context[varname] = instance_variable_get("@"+varname.to_s)
      end
    end
    def get_matching_search_position(position)
      @__wee_search_positions[position]
    end

    def state=(newState)
      @__wee_stop_positions = Array.new if self.state != newState
      self.search @__wee_search_positions_original
      @__wee_state = newState
      handler = @__wee_handler.new(handlerargs)
      handler.inform_workflow_state newState
    end

  public
    # set the Handler
    def handler=(new_wee_handler)
      superclass = new_wee_handler
      while superclass
        check_ok = true if superclass == Wee::HandlerWrapperBase
        superclass = superclass.superclass
      end
      raise "Handler is not inhereted from HandlerWrapperBase" unless check_ok
      @__wee_handler = new_wee_handler
    end

    # Get/Set the handler arguments
    def handlerargs=(*args)
      @__wee_handlerargs = args
    end
    def handlerargs
      @__wee_handlerargs
    end

    # Get the state of execution (ready|running|stopped|finished)
    def state
      @__wee_state || :ready
    end

    # Set search positions
    def search(new_wee_search)
      @__wee_search_positions = {}
      @__wee_search_positions_original = []

      new_wee_search = [new_wee_search] if new_wee_search.is_a?(SearchPos)
  
      if(new_wee_search == false || new_wee_search.empty?)
        @__wee_search_original = false
      else  
        @__wee_search_original = true
        if new_wee_search.is_a?(Array)
          @__wee_search_positions_original = new_wee_search
        else
          @__wee_search_positions_original = [new_wee_search]
        end
        @__wee_search_positions_original.each { |search_position| @__wee_search_positions[search_position.position] = search_position } if @__wee_search_positions_original.is_a?(Array)
      end
      @__wee_search = @__wee_search_original
    end
    # Get search positions
    def search_positions
      return @__wee_search_positions_original
    end

    # get/set/clean context
    def context(new_context = nil)
      @__wee_context ||= CHash.new
      if new_context.nil?
        @__wee_context ? @__wee_context : CHash.new
      else  
        if new_context.is_a?(CHash)
          new_context.each do |name, value|
            @__wee_context[name.to_s.to_sym] = value
            self.instance_variable_set("@#{name}".to_sym,value)
          end
        end
      end  
    end

    # get/set/clean endpoints
    def endpoints(new_endpoints = nil)
      @__wee_endpoints ||= Hash.new
      if new_endpoints.nil?
        @__wee_endpoints ? @__wee_endpoints : Hash.new
      else
        if new_endpoints.is_a?(Hash)
          new_endpoints.each do |name,value|
            @__wee_endpoints["@#{name}".to_sym] = value
          end
        end
      end
    end
    def endpoint(e)
      self.endpoints e
    end

    # get/set workflow description
    def wf_description(code = nil,&blk)
      if code.nil? && !block_given?
        @__wee_wfsource
      else
        unless block_given?
          @__wee_wfsource = code
          blk = Proc.new{instance_eval(@__wee_wfsource)}
        end
        replace(&blk)
      end
      nil
    end

    # set directly through block
    def replace(&blk)
      (class << self; self; end).class_eval do
        define_method :__wee_execute do
          self.state = :running
          instance_eval(&blk)
          self.state = :finished if self.state == :running
          [self.state, position, context]
        end
      end
    end

    # Stop the workflow execution
    def stop()
      self.state = :stopped
    end
    # Start the workflow execution
    def start()
      return nil if self.state == :running
      __wee_execute
    end

end
