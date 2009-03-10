require 'thread'

class Wee
  
  def initialize
    # Attention (!!!), redefined, see wee_initialize
    wee_initialize
  end
  def self::wee_initialize
    send :define_method, :initialize do
      @__wee_context = Hash.new
      initialize_search if methods.include?('initialize_search')
      initialize_context if methods.include?('initialize_context')
      
      @search = @__wee_search
      @search_position = @__wee_search_positions
      @__wee_threads = Array.new;
      @__wee_endstate = :normal
      $LOG = Logger.new(STDOUT) unless defined? $LOG
    end
  end
  def self::search(wee_search,wee_search_positions=[])
    define_method :initialize_search do
      @__wee_search = wee_search
      if wee_search_positions.is_a?(Array)
        @__wee_search_positions = wee_search_positions
      else
        @__wee_search_positions = Array.new
        @__wee_search_positions << wee_search_positions
      end
    end
    wee_initialize
  end
  def self::endpoint(endpoints)
    endpoints.each do |name,value|
      define_method name do
        return value
      end
    end
  end
  def self::context(variables)
    # define method to get context
    define_method :context do |*optNew|

      if optNew.size == 1 && optNew[0].is_a?(Hash) # New Context Variable(s) are going to be defined
        optNew[0].each do |name, value|
          instance_variable_set(("@" + name.to_s).to_sym,value)
          @__wee_context[("@" + name.to_s).to_sym] = value
        end
      end 
      return @__wee_context
    end 

    # translate context into instance variables
    define_method :initialize_context do
      unless @__wee_context
        @__wee_context = Hash.new
      end
      variables.each do |name, value|
        instance_variable_set(("@" + name.to_s).to_sym,value)
        @__wee_context[("@" + name.to_s).to_sym] = value
      end
    end
    wee_initialize
  end
  def self::endstate(state)
    @__wee_endstate = state;
    define_method :endstate do |*optState|
      newState = *optState
      if newState
        @__wee_endstate = newState
      end
      return @__wee_endstate  
    end
  end
  
  protected
    def position
      
    end
    def activity(position, type, endpoint=nil,*parameters, &block)
      return if endstate == :stopped || is_in_search_mode(position)
      return if Thread.current[:nolongernecessary]
      
      handler = create_handler
      begin
        case type
          when :manipulate
            yield if block
            refreshcontext
            handler.inform_activity_done position, context
          when :call
            retValue = perform_external_call handler, endpoint, parameters
            yield(retValue) if block && endstate != :stopped && !Thread.current[:nolongernecessary]
            refreshcontext
            handler.inform_activity_done position, context if endstate != :stopped || !Thread.current[:nolongernecessary]
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
      @__wee_threads = Array.new
      mythreads = Array.new
      # Handle the yield block (= def of parallel branches) in a 
      # Mutex to resolve conflicts (waiting for branches) in 
      # nested parallel blocks
      semaphore = Mutex.new
      semaphore.synchronize { 
        yield #(pid)
        mythreads = @__wee_threads.clone
      }
      
      
      if type == :wait # Wait for each branch to join
        mythreads.each { |thread| thread.join } 
      else # wait until at least 1 thread(=branch) finished
        allthreadsrunning = true 
        while allthreadsrunning 
          mythreads.each { |thread|  allthreadsrunning = false unless thread.alive?}
          Thread.pass;
        end
        mythreads.each { |thread|  thread[:nolongernecessary] = true}
      end
    end
    # Defines a branch of a parallel-Construct
    def parallel_branch
      @__wee_threads << Thread.new do
        Thread.current[:branch_search] = @search
        yield
      end
    end

    # Switch DSL-Construct
    # Defines a choice in the Workflow path.
    # May contain multiple execution alternatives
    def switch
      Thread.current[:alternative_executed] = false
      yield
    end
    # Defines a possible choice of a switch-Construct
    # Block is executed if condition == true or
    # searchmode is active (to find the starting position)
    def alternative(condition = nil)
      if(condition == nil)
        yield if Thread.current[:alternative_executed]
      else
        yield if is_in_search_mode || condition
        Thread.current[:alternative_executed] = true if condition
      end
      
    end
    
  private
    def is_in_search_mode(position = nil)
      # set semaphore to avoid conflicts if @search is changed by another thread
      semaphore = Mutex.new
      semaphore.synchronize { 
        branch = Thread.current;
        if position && @search_position.member?(position) # matching searchposition => start execution from here
          $LOG.debug("Wee.activity") {"position #{position} found, processing branch from here"}
          branch[:branch_search] = false;
          @search = false;
        end
        if branch[:branch_search] || @search # is activity part of a branch and in search mode?
          $LOG.debug("Wee.activity") {"omitting #{position}, this branch is still in search mode"}
          return true;
        end
      }
      return false;
    end
    def perform_external_call(handler, endpoint, *parameters)
      # handshake call and wait until it finisheds
      handler.handle_call endpoint, parameters
      Thread.pass until handler.finished_call() || endstate == :stopped || Thread.current[:nolongernecessary]

      if Thread.current[:nolongernecessary]
        handler.no_longer_necessary
      end
      unless endstate == :stopped
        return handler.return_value
      else
        handler.stop_call
        return nil;
      end
      
    end
    def refreshcontext()
      @__wee_context.each { |varname, value| 
        @__wee_context[varname] = instance_variable_get(varname)
      }
    end
    
  public
    def stop()
      $LOG.debug('Wee.stop') {"Got Stop signal, ...."}
      @__wee_endstate = :stopped
    end
    def replace_execute(&block)
      # instance_eval
    end
end

class SearchPos
  attr_accessor :position, :detail, :toggle
  def initialize(position, detail=:at, toggle=nil)
    @position = position
    @detail = detail
    @toggle = toggle
  end
end